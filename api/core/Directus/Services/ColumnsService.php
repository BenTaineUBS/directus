<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Services;

use Directus\Database\Ddl\Column\Custom;
use Directus\Database\Object\Table;
use Directus\Database\SchemaManager;
use Directus\Database\TableGateway\RelationalTableGateway as TableGateway;
use Directus\Database\TableSchema;
use Directus\Database\Object\Column;
use Directus\Exception\Exception;
use Directus\Util\ArrayUtils;
use Zend\Db\Sql\Ddl\AlterTable;
use Zend\Db\Sql\Ddl\Column\Integer;
use Zend\Db\Sql\Ddl\Constraint\PrimaryKey;
use Zend\Db\Sql\Sql;

/**
 * Column service
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class ColumnsService extends AbstractService
{
    const PRIMARY_KEY = 'primary_key';
    const SORT = 'sort';

    /**
     * @var TableGateway
     */
    protected $tableGateway = null;

    /**
     * Gets the given column data
     *
     * It creates the directus data if it does not exists
     * based on the actual column information
     *
     * @param $tableName
     * @param $columnName
     *
     * @return \Directus\Database\RowGateway\BaseRowGateway
     */
    private function getColumnData($tableName, $columnName)
    {
        $tableGateway = $this->getTableGateway();
        $columnData = $tableGateway->select([
            'table_name' => $tableName,
            'column_name' => $columnName
        ])->current();

        if (!$columnData) {
            $columnObject = $this->getColumnObject($tableName, $columnName);
            $data = ArrayUtils::pick($columnObject->toArray(), [
                'table_name',
                'column_name',
                'data_type',
                'ui',
                'sort',
                'comment'
            ]);
            $columnData = $tableGateway->manageRecordUpdate('directus_columns', $data, TableGateway::ACTIVITY_ENTRY_MODE_DISABLED);
        }

        return $columnData;
    }

    /**
     * Updates the given column
     *
     * @param $tableName
     * @param $columnName
     * @param $data
     * @param bool $patch
     *
     * @return null
     */
    public function update($tableName, $columnName, $data, $patch = false)
    {
        $tableGateway = $this->getTableGateway();

        $columnData = $this->getColumnData($tableName, $columnName);
        if (!$columnData) {
            return null;
        }

        $columnData = $columnData->toArray();

        // if the column is a system column
        // set the current column to the default interface
        $this->updateCurrentSystemInterfaces($tableName, ArrayUtils::get($data, 'ui'));

        $this->ddlUpdate($tableName, $columnName, $data);
        $data = ArrayUtils::pick($data, [
            'data_type',
            'ui',
            'hidden_input',
            'hidden_list',
            'required',
            'relationship_type',
            'related_table',
            'junction_table',
            'junction_key_left',
            'junction_key_right',
            'sort',
            'comment'
        ]);

        if ($data) {
            $data['id'] = $columnData['id'];

            // FIXME: hard coded
            $relationshipType = ArrayUtils::get($data, 'relationship_type', null);
            $manytoones = ['single_file', 'many_to_one', 'many_to_one_typeahead', 'MANYTOONE'];
            if (!$relationshipType && array_key_exists('ui', $data) && in_array($data['ui'], $manytoones)) {
                $data['relationship_type'] = 'MANYTOONE';
                $data['junction_key_right'] = $columnName;
            }

            $tableGateway->updateCollection($data);
        }

        return $data;
    }

    /**
     * Gets the column representation object
     *
     * @param $tableName
     * @param $columnName
     *
     * @return \Directus\Database\Object\Column
     */
    public function getColumnObject($tableName, $columnName)
    {
        return TableSchema::getColumnSchema($tableName, $columnName);
    }

    /**
     * Get the table gateway
     *
     * @return TableGateway
     */
    public function getTableGateway()
    {
        if (!$this->tableGateway) {
            $container = $this->app->container;
            $dbConnection = $container->get('zenddb');
            $acl = $container->get('acl');

            $this->tableGateway = new TableGateway('directus_columns', $dbConnection, $acl);
        }

        return $this->tableGateway;
    }

    public function ddlUpdate($tableName, $columnName, $data, $options = [])
    {
        if (ArrayUtils::has($data, 'default_value') || ArrayUtils::has($data, 'data_type')) {
            $adapter = $this->getTableGateway()->getAdapter();
            $columnObject = $this->getColumnObject($tableName, $columnName);

            $alterTable = new AlterTable($tableName);
            $newColumn = new Custom(
                $columnName,
                $columnObject->getLength(),
                $columnObject->isNullable(),
                $columnObject->getDefaultValue()
            );

            if (ArrayUtils::has($data, 'default_value')) {
                $value = $data['default_value'];
                $type = $columnObject->getType();
                $length = $columnObject->getLength();
                $schemaManager = $this->getTableGateway()->getSchemaManager();
                if ($columnObject->isNullable() && empty($value)) {
                    $value = null;
                }
                $defaultValue = $schemaManager->castDefaultValue($value, $type, $length);
                $newColumn->setDefault($defaultValue);
            }

            // @TODO: add a list of supported types by databases
            $type = ArrayUtils::get($data, 'data_type', $columnObject->getDataType());
            $newColumn->setType($type);

            if (ArrayUtils::has($data, 'length')) {
                $length = ArrayUtils::get($data, 'length', 0);
                $newColumn->setLength($length);
            }

            $alterTable->changeColumn($columnName, $newColumn);

            $sql = new Sql($adapter);
            $query = $sql->getSqlStringForSqlObject($alterTable);
            $adapter->query($query)->execute();
        }
    }

    public function addColumn($table, $data)
    {
        $tableObject = $this->getSchemaManager()->getTableSchema($table);
        $columnName = ArrayUtils::get($data, 'column_name');

        if (!$tableObject) {
            throw new \Exception(sprintf('table [%s] not found', $table));
        }

        // if the column is a system column
        // set the current column to the default interface
        $interfaceName = ArrayUtils::get($data, 'ui');
        $this->updateCurrentSystemInterfaces($table, $interfaceName);

        $result = $this->createColumn($table, $data);

        // Primary column
        if ($interfaceName === SchemaManager::INTERFACE_PRIMARY_KEY) {
            if (!$this->setPrimaryColumn($table, $columnName)) {
                throw new \Exception('error creating the new column');
            }
        }

        return $result;
    }

    /**
     * Creates a new column in the given table
     *
     * @param $table
     * @param $data
     *
     * @return string
     */
    public function createColumn($table, $data)
    {
        $tableGateway = $this->getTableGateway();

        return $tableGateway->addColumn($table, $data);
    }

    /**
     * Add primary key to the given column
     *
     * @param $table
     * @param $column
     *
     * @return bool
     */
    public function setPrimaryColumn($table, $column)
    {
        return $this->getSchemaManager()->addPrimaryKey($table, $column);
    }

    /**
     * Removes the primary key from the given column
     *
     * @param $table
     * @param $column
     *
     * @return bool
     */
    public function removePrimaryKey($table, $column)
    {
        // update the column with a new column without auto_increment or keys
        return $this->getSchemaManager()->dropPrimaryKey($table, $column);
    }

    /**
     * Change the current table to the default interface
     *
     * @param $table
     * @param $column
     *
     * @return int
     */
    public function setDefaultInterface($table, $column)
    {
        $columnsTableGateway = $this->createTableGateway('directus_columns');
        $columnObject = $this->getSchemaManager()->getColumnSchema($table, $column);

        return $columnsTableGateway->update([
            'ui' => $this->getSchemaManager()->getColumnDefaultInterface($columnObject->getType()),
            'options' => NULL
        ], [
            'table_name' => $table,
            'column_name' => $column
        ]);
    }

    /**
     * Sets the column (data) to default interface
     *
     * @param $table
     * @param $newInterfaceName
     */
    protected function updateCurrentSystemInterfaces($table, $newInterfaceName)
    {
        /** @var Table $tableObject */
        $tableObject = $this->getSchemaManager()->getTableSchema($table);

        if (!TableSchema::isSystemColumn($newInterfaceName)) {
            return;
        }

        $callback = function ($column) use ($table, $newInterfaceName) {
            if ($newInterfaceName === SchemaManager::INTERFACE_PRIMARY_KEY) {
                $this->removePrimaryKey($table, $column);
            }

            $this->setDefaultInterface($table, $column);
        };

        foreach ($tableObject->getColumns() as $columnObject) {
            if ($columnObject->getUI() === $newInterfaceName) {
                $callback($columnObject->getName());
            }
        }
    }
}

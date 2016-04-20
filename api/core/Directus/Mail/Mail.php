<?php

namespace Directus\Mail;

use InvalidArgumentException;
use Clousure;
use Swift_Message;
use Directus\Bootstrap;

class Mail
{
    protected $mailer = null;
    protected $settings = [];

    public function __construct($mailer)
    {
        $this->mailer = $mailer;
        $DirectusSettingsTableGateway = new \Zend\Db\TableGateway\TableGateway('directus_settings', Bootstrap::get('zendDb'));
        $rowSet = $DirectusSettingsTableGateway->select();
        foreach ($rowSet as $setting) {
            $this->settings[$setting['collection']][$setting['name']] = $setting['value'];
        }
    }

    public function sendMessage($message)
    {
        $this->mailer->send($message);
    }

    public function getViewContent($viewPath, $data)
    {
        ob_start();

        $app = Bootstrap::get('app');
        $viewContentPath = $app->container['settings']['templates.path'].$viewPath;
        $viewFooterPath = $app->container['settings']['templates.path'].'mail/footer.twig.html';
        $data = array_merge(['settings' => $this->settings], $data);

        extract($data);
        include $viewContentPath;
        include $viewFooterPath;

        return nl2br(ob_get_clean());
    }

    public static function send($viewPath, $data, $callback)
    {
        $config = Bootstrap::get('config');
        $mailer = Bootstrap::get('mailer');
        if (!$mailer) {
            throw new InvalidArgumentException('Mail configuration not defined.');
        }

        $instance = new static($mailer);

        $message = Swift_Message::newInstance();

        // default mail from address
        $mailConfig = $config['mail'];
        $message->setFrom($mailConfig['from']);

        call_user_func($callback, $message);

        if ($message->getBody() == null) {
            // Slim Extras View twig act weird on this version
            $viewContent = $instance->getViewContent($viewPath, $data);
            $message->setBody($viewContent, 'text/html');
        }

        $instance->sendMessage($message);
    }
}

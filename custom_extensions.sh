#!/bin/sh -

DIRECTUS_DIR="/directus/api"
DIRECTUS_EXTENSIONS="${DIRECTUS_DIR}/extensions"
DIRECTUS_INTERFACES="${DIRECTUS_EXTENSIONS}/interfaces"
DIRECTUS_MODULES="${DIRECTUS_EXTENSIONS}/modules"
DIRECTUS_DISPLAYS="${DIRECTUS_EXTENSIONS}/displays"

#DIRECTUS_DIR="/tmp"

# Install https://github.com/utomic-media/directus-extension-field-actions
mkdir -p ${DIRECTUS_DISPLAYS}/fields-action
wget -O ${DIRECTUS_DISPLAYS}/fields-action/index.js https://github.com/utomic-media/directus-extension-field-actions/releases/download/1.1.1/display-index.js
mkdir -p ${DIRECTUS_INTERFACES}/fields-action
wget -O ${DIRECTUS_INTERFACES}/fields-action/index.js https://github.com/utomic-media/directus-extension-field-actions/releases/download/1.1.1/interface-index.js

# Install https://github.com/u12206050/directus-extension-global-search
mkdir -p ${DIRECTUS_MODULES}
#wget -O /tmp/global-search.zip https://github.com/u12206050/directus-extension-global-search/releases/download/1.0.0/global-search.zip
#unzip -d ${DIRECTUS_MODULES}/ /tmp/global-search.zip

# Install https://github.com/u12206050/directus-extension-api-viewer-module
#mkdir -p ${DIRECTUS_MODULES}/api-viewer
#wget -O ${DIRECTUS_MODULES}/api-viewer/index.js https://github.com/u12206050/directus-extension-api-viewer-module/releases/download/1.1.1/index.js

# Install https://github.com/dimitrov-adrian/directus-extension-masked-interface
mkdir -p ${DIRECTUS_INTERFACES}/fields-masked
wget -O ${DIRECTUS_INTERFACES}/fields-masked/index.js https://github.com/dimitrov-adrian/directus-extension-masked-interface/releases/download/v1.1.0/index.js

# Install crawless custom extensions
# Download from project: https://gitlab.com/crawless/directus-custom-extensions
rm -rf directus-custom-extensions-release*
curl --header "Private-Token: ${GITLAB_PIPELINE_TOKEN}" -LO ${CI_API_V4_URL}/projects/40500377/packages/generic/Releases/0.0.1/directus-custom-extensions-release.zip

unzip directus-custom-extensions-release.zip

ls -la ./directus-custom-extensions-release

cp -r ./directus-custom-extensions-release/collection-ext ${DIRECTUS_INTERFACES}
cp -r ./directus-custom-extensions-release/filter-ext ${DIRECTUS_INTERFACES}
cp -r ./directus-custom-extensions-release/loading-api-field ${DIRECTUS_INTERFACES}
cp -r ./directus-custom-extensions-release/image-carousel ${DIRECTUS_INTERFACES}
cp -r ./directus-custom-extensions-release/contact-display ${DIRECTUS_DISPLAYS}

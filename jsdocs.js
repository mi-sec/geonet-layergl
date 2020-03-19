/** ****************************************************************************************************
 * File: jsdocs.js
 * Project: template-npm-module
 * @author Nick Soggin <iSkore@users.noreply.github.com> on 30-May-2018
 *******************************************************************************************************/
'use strict';

module.exports = {
    plugins: [
        'plugins/markdown'
    ],
    recurseDepth: 20,
    source: {
        include: [
            'README.md',
            './'
        ],
        exclude: [
            'demo',
            'docs',
            'node_modules'
        ],
        includePattern: '.+\\.js(doc|x)?$',
        excludePattern: '(^|\\/|\\\\)_|(^|\\/|\\\\)node_modules'
    },
    sourceType: 'module',
    tags: {
        allowUnknownTags: true,
        dictionaries: [
            'jsdoc',
            'closure'
        ]
    },
    templates: {
        cleverLinks: true,
        monospaceLinks: true
    },
    opts: {
        encoding: 'utf8',
        destination: 'docs/',
        recurse: true,
        template: './node_modules/postman-jsdoc-theme',
        tutorials: './docs/demo/'
    }
};

const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  configureWebpack: config => {
    config.externals = {
        'better-sqlite3': 'commonjs better-sqlite3'
    };
  },
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        win: {
          icon: 'src/assets/icon.jpg'
        },
        extraResources: [
          {
            "from": "src/resources/bin",
            "to": "bin",
            "filter": [
              "**/*"
            ]
          }
        ]
      },
      externals: [ 'better-sqlite3' ],
      nodeIntegration: true
    }
  }
})

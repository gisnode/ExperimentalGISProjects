const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        extraResources: [
          {
            "from": "resources/bin",
            "to": "bin",
            "filter": [
              "**/*"
            ]
          }
        ]
      }
    }
  }
})
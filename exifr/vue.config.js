const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
        builderOptions: {
            win: {
                icon: 'src/assets/icon.png'
            }
        },
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

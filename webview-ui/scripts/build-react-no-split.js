#!/usr/bin/env node

/**
 * A script that overrides some of the create-react-app build script configurations
 * in order to disable code splitting/chunking and rename the output build files so
 * they have no hash. (Reference: https://mtm.dev/disable-code-splitting-create-react-app).
 *
 * This is crucial for getting React webview code to run because VS Code expects a
 * single (consistently named) JavaScript and CSS file when configuring webviews.
 */

// Set environment variables that CRA expects
process.env.NODE_ENV = 'production'
process.env.BABEL_ENV = 'production'

const webpack = require('webpack')
const configFactory = require('react-scripts/config/webpack.config')
const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin")
const path = require("path")
const fs = require("fs")
const rimraf = require('rimraf')

try {
  // Clear webpack cache
  const cacheDir = path.resolve(__dirname, '..', 'node_modules', '.cache')
  if (fs.existsSync(cacheDir)) {
    console.log('Clearing webpack cache...')
    rimraf.sync(cacheDir)
  }

  console.log("Creating webpack config...")
  const config = configFactory('production')
  
  if (!config) {
    throw new Error("Config is undefined")
  }

  console.log("Webpack config created, setting up compiler...")

  // Get all files in the shared directory
  const sharedDir = path.resolve(__dirname, "..", "..", "src", "shared")
  const nodeModulesDir = path.resolve(__dirname, "..", "node_modules")

  // Configure webpack to handle shared directory and node_modules
  config.resolve.modules = [
    'node_modules',
    path.resolve(__dirname, '..', 'src'),
    nodeModulesDir
  ]

  // Add shared directory and node_modules to module rules include paths
  config.module.rules.forEach(rule => {
    if (rule.oneOf) {
      rule.oneOf.forEach(loader => {
        if (loader.include) {
          if (Array.isArray(loader.include)) {
            loader.include.push(
              path.resolve(__dirname, '..', 'src'),
              nodeModulesDir
            )
          } else {
            loader.include = [
              loader.include,
              path.resolve(__dirname, '..', 'src'),
              nodeModulesDir
            ]
          }
        }
      })
    }
  })

  // Remove ModuleScopePlugin to allow imports from outside src
  config.resolve.plugins = config.resolve.plugins.filter(
    (plugin) => !(plugin instanceof ModuleScopePlugin)
  )

  function getAllFiles(dir) {
    let files = []
    try {
      fs.readdirSync(dir).forEach((file) => {
        const filePath = path.join(dir, file)
        if (fs.statSync(filePath).isDirectory()) {
          files = files.concat(getAllFiles(filePath))
        } else {
          // Skip test files
          if (!file.endsWith(".test.ts")) {
            const withoutExtension = path.join(dir, path.parse(file).name)
            files.push(withoutExtension)
          }
        }
      })
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}:`, error)
    }
    return files
  }
  
  const sharedFiles = getAllFiles(sharedDir)
  
  // Whitelist specific files that can be imported from outside src
  config.resolve.plugins.forEach((plugin) => {
    if (plugin instanceof ModuleScopePlugin) {
      console.log("Whitelisting shared files and node_modules...")
      sharedFiles.forEach((file) => plugin.allowedFiles.add(file))
      // Allow importing from node_modules
      plugin.allowedFiles.add(nodeModulesDir)
    }
  })

  // Process TypeScript files from shared directory
  config.module.rules[1].oneOf.forEach((rule) => {
    if (rule.test && rule.test.toString().includes("ts|tsx")) {
      rule.include = [rule.include, sharedDir].filter(Boolean)
    }
  })

  // Add CSS loader for node_modules
  config.module.rules[1].oneOf.unshift({
    test: /\.css$/,
    include: /node_modules/,
    use: ['style-loader', 'css-loader']
  })

  // Disable code splitting and optimization
  config.optimization = {
    ...config.optimization,
    splitChunks: {
      cacheGroups: {
        default: false,
      },
    },
    runtimeChunk: false,
    minimize: true,
    concatenateModules: false // Disable module concatenation
  }

  // Rename main.{hash}.js to main.js
  config.output = {
    ...config.output,
    filename: "static/js/[name].js",
    chunkFilename: "static/js/[name].chunk.js"
  }

  // Rename main.{hash}.css to main.css
  config.plugins[5].options.filename = "static/css/[name].css"
  config.plugins[5].options.moduleFilename = () => "static/css/main.css"

  // Create webpack compiler and run build
  console.log("Starting webpack build...")
  const compiler = webpack(config)
  
  // Disable caching for this build
  compiler.options.cache = false
  
  compiler.run((err, stats) => {
    if (err) {
      console.error("Webpack build error:", err)
      process.exit(1)
    }
    
    if (stats.hasErrors()) {
      console.error("Build failed with errors:")
      const info = stats.toJson({
        errors: true,
        warnings: true,
        modules: false,
        chunks: false
      })
      
      info.errors.forEach((error) => {
        console.error("\nError:", error.message)
        if (error.details) console.error("Details:", error.details)
        if (error.stack) console.error("Stack:", error.stack)
      })
      
      process.exit(1)
    }
    
    console.log(stats.toString({
      chunks: false,
      colors: true
    }))
    
    compiler.close((closeErr) => {
      if (closeErr) {
        console.error("Error closing compiler:", closeErr)
        process.exit(1)
      }
      console.log("Build completed successfully")
    })
  })

} catch (error) {
  console.error("Build script error:", error)
  process.exit(1)
}

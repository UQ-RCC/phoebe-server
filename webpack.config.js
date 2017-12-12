const path = require("path");

module.exports = {
    entry: "./server.ts",
    output: {
        filename: "server-bundle.js"
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        loaders: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',               
            }            
        ]       
    },
    
    target: "node"
}
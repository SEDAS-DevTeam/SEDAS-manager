import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
    resolve: {
        alias: {
            "@assets": path.resolve(__dirname, "./src/res/data/img")
        }
    },
    base: "/",
    root: "./src/res",
    plugins: [
        solid(),
        tailwindcss()
    ],
    build: {
        outDir: "./dist",
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            input: {
                main: './src/res/index.html',
                preload: './src/res/components/preload.ts',
            },
            output: {
                format: 'cjs', // Force CJS for preload
                entryFileNames: (chunk) => chunk.name === 'preload' ? 'preload.js' : 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash][extname]'
            },
        }
    }
})

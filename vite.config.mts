import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    root: "./src/res",
    plugins: [
        solid(),
        tailwindcss()
    ],
    build: {
        sourcemap: true,
        rollupOptions: {
            input: {
                preload: './src/res/components/preload.ts',
            },
            output: {
                format: 'cjs', // Force CJS for preload
                entryFileNames: 'preload.js',
            },
        }
    }
})

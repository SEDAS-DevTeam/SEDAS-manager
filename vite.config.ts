import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    root: "./src/res",
    plugins: [
        solid(),
        tailwindcss()
    ],
})

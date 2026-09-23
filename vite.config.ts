import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

/**
 * The npm package: ESM with `@lordicon/utils-lottie` left external and the renderer
 * (`@lordicon/internal`) bundled in, plus type declarations.
 */
export default defineConfig({
    plugins: [
        dts({
            include: ['src'],
            exclude: ['src/**/*.test.ts', 'src/testing/**'],
            // Declarations mirror src/ but sit at the dist root, next to index.js.
            beforeWriteFile: (filePath, content) => ({
                filePath: filePath.replace('/dist/src/', '/dist/'),
                content,
            }),
        }),
    ],
    build: {
        target: 'es2022',
        lib: {
            formats: ['es'],
            entry: resolve(import.meta.dirname, 'src', 'index.ts'),
            fileName: () => 'index.js',
        },
        rollupOptions: { external: ['@lordicon/utils-lottie'] },
    },
});

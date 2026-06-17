import { resolve, sep } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        dts({
            insertTypesEntry: true,
            beforeWriteFile: (filePath, content) => {
                return {
                    filePath: filePath.replace(`${sep}dist${sep}src${sep}`, `${sep}dist${sep}`),
                    content,
                };
            },
        }),
    ],
    build: {
        target: 'es2015',
        lib: {
            formats: ['es'],
            fileName: () => 'index.js',
            entry: resolve(__dirname, 'src', 'index.ts'),
        },
        rollupOptions: {
            output: {
                inlineDynamicImports: true,
            },
        },
        emptyOutDir: true,
    }
});
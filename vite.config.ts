import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ViteImageOptimizer({
      /* Automatically convert and compress images on build */
      png: {
        quality: 80,
      },
      jpeg: {
        quality: 80,
      },
      jpg: {
        quality: 80,
      },
      webp: {
        quality: 80,
      },
    }),
    // Note: rollup-plugin-visualizer removed due to ESM compatibility issues
    // Alternative: Use "npm run build -- --mode=analyze" when needed
  ],
  
  build: {
    // Split code into smaller chunks
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'icons': ['react-icons/fa'],
          'utils': ['axios']
        }
      }
    },
    
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 600,
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    },
    
    // Source maps (disable for production)
    sourcemap: false,
    
    // CSS code splitting
    cssCodeSplit: true
  },
  
  server: {
    port: 3000,
    open: true
  }
})
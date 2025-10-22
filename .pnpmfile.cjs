module.exports = {
  hooks: {
    readPackage(pkg) {
      // For Vercel deployment, we want to skip backend dependencies
      // that cause build issues
      if (process.env.VERCEL) {
        // Remove backend-specific dependencies that cause issues
        const backendDeps = ['bcrypt', 'pg', 'express', 'jsonwebtoken'];
        
        backendDeps.forEach(dep => {
          if (pkg.dependencies && pkg.dependencies[dep]) {
            console.log(`Skipping ${dep} for Vercel build`);
            delete pkg.dependencies[dep];
          }
        });
      }
      return pkg;
    }
  }
}
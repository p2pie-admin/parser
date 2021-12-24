declare global {
  namespace NodeJS {
    interface ProcessEnv {
      RATES_PROVIDER: string;
      STRAPI: string;
      LOCAL_STRAPI: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};

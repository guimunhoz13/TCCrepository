import nextJest from "next/jest.js";

// O sistema é usado no Brasil. Sem fixar o fuso, os testes rodariam em UTC
// no CI e deixariam passar erros de conversão de data.
process.env.TZ = "America/Sao_Paulo";

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: "node",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/", "<rootDir>/e2e/"],
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  // O mesmo denominador da auditoria: todo JS/JSX de src, inclusive páginas
  // ainda sem testes. O gate impede regredir abaixo da meta documentada.
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.{js,jsx}"],
  coverageThreshold: { global: { lines: 70 } },
};

export default createJestConfig(customJestConfig);

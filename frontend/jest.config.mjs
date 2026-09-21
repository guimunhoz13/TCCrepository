import nextJest from "next/jest.js";

// O sistema é usado no Brasil. Sem fixar o fuso, os testes rodariam em UTC
// no CI e deixariam passar erros de conversão de data.
process.env.TZ = "America/Sao_Paulo";

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: "node",
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
};

export default createJestConfig(customJestConfig);

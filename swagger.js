import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Inventory API",
      version: "1.0.0",
      description: "API documentation for inventory service",
    },
  },
  apis: ["./index.js"], // <— Swagger шукає коментарі ТУТ
};

export const swaggerSpec = swaggerJsdoc(options);

import { Request, Response } from "express";
import { prismaClient } from "..";
import { NotFoundException } from "../exceptions/not_found";
import { ErrorCode } from "../exceptions/root";

// create product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const product = await prismaClient.product.create({
      data: {
        ...req.body,
        tags: req.body.tags.join(","),
      },
    });
    res.json(product);
  } catch (error: any) {
    res.json(error.message);
  }
};

// update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = req.body;
    if (product.tags) {
      product.tags = product.tags.join(",");
    }

    // convert id to number
    const id = parseInt(req.params.id, 10);
    const updatedProduct = await prismaClient.product.update({
      where: {
        id,
      },
      data: product,
    });
    res.json(updatedProduct);
  } catch (err) {
    throw new NotFoundException(
      "Product not found",
      ErrorCode.PRODUCT_NOT_FOUND
    );
  }
};

// delete product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    // convert id to number
    const id = parseInt(req.params.id, 10);
    await prismaClient.product.delete({
      where: { id },
    });
    res.status(201).json({
      status: "success",
      message: "product has been deleted!",
    });
  } catch (error) {
    throw new NotFoundException(
      "Product not found",
      ErrorCode.PRODUCT_NOT_FOUND
    );
  }
};

export const listProduct = async (req: Request, res: Response) => {
  const count = await prismaClient.product.count();
  const products = await prismaClient.product.findMany({
    skip: +req.query.skip || 0,
    take: 5,
  });
  res.json({
    count,
    data: products,
  });
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await prismaClient.product.findFirstOrThrow({
      where: {
        id: +req.params.id,
      },
    });
    res.json(product);
  } catch (err) {
    throw new NotFoundException(
      "Product not found",
      ErrorCode.PRODUCT_NOT_FOUND
    );
  }
};

// const prismaClient = new PrismaClient();
export const searchProducts = async (req: Request, res: Response) => {
  const products = await prismaClient.product.findMany({
    where: {
      name: {
        search: req.query.q?.toString(),
      },
      description: {
        search: req.query.q?.toString(),
      },
      tags: {
        search: req.query.q?.toString(),
      },
    },
  });
  res.json({ count: products.length, products });
};

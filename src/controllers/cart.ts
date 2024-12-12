import { Request, Response } from "express";
import { ChangeOuantitySchema, CreatCartSchema } from "../schema/cart";
import { NotFoundException } from "../exceptions/not_found";
import { ErrorCode } from "../exceptions/root";
import { prismaClient } from "..";
import { Product } from "@prisma/client";
import { User } from "@prisma/client";
import { BadRequestException } from "../exceptions/bad_request";

export const addItemToCart = async (req: Request, res: Response) => {
  const validatedData = CreatCartSchema.parse(req.body);
  let product: Product;
  try {
    product = await prismaClient.product.findFirstOrThrow({
      where: {
        id: validatedData.productId,
      },
    });
  } catch (err) {
    throw new NotFoundException(
      "Product not found",
      ErrorCode.PRODUCT_NOT_FOUND
    );
  }

  // check if the product already exists in the user's cart
  const existingCartItem = await prismaClient.cartItem.findFirst({
    where: {
      userId: req.user.id,
      productId: product.id,
    },
  });
  let cartItem;
  if (existingCartItem) {
    // update the quantity if the item already exists in the cart
    cartItem = await prismaClient.cartItem.update({
      where: {
        id: existingCartItem.id,
      },
      data: {
        quantity: existingCartItem.quantity + validatedData.quantity,
      },
    });
  } else {
    // create a new cart item if it doesnt
    cartItem = await prismaClient.cartItem.create({
      data: {
        userId: req.user.id,
        productId: product.id,
        quantity: validatedData.quantity,
      },
    });
  }

  res.json({
    user: `${req.user.name} created this cart`,
    cartItem,
  });
};

export const deleteItemFromCart = async (req: Request, res: Response) => {
  try {
    let loggedInUser = req.user.id;
    let cartId = +req.params.id;

    const cartToBeDeleted = await prismaClient.cartItem.findFirst({
      where: { id: cartId },
    });

    //check if cart exists
    if (!cartToBeDeleted) {
      return res.status(404).json({ message: "Cart not found!" });
    }

    // check if user is deleting his/her own item:
    if (cartToBeDeleted?.userId !== loggedInUser) {
      throw new BadRequestException(
        "You are not authorized to delete this cart",
        ErrorCode.UNAUTHORIZED
      );
    }

    // delete cart.
    await prismaClient.cartItem.delete({
      where: {
        id: cartId,
      },
    });
    res.status(201).json({
      status: "success sir/ma",
      message: "You have deleted this cart!",
    });
  } catch (error: any) {
    res.json({ error: error.message });
    // throw new NotFoundException("Cart not found", ErrorCode.PRODUCT_NOT_FOUND);
  }
};

export const changeOuantity = async (req: Request, res: Response) => {
  const validatedData = ChangeOuantitySchema.parse(req.body);

  try {
    let loggedInUser = req.user.id;
    let cartId = +req.params.id;

    const cartQuantitytoBeUpdated = await prismaClient.cartItem.findFirst({
      where: { id: cartId },
    });

    //check if cart exists
    if (!cartQuantitytoBeUpdated) {
      return res.status(404).json({ message: "Cart not found!" });
    }

    // check if user is deleting his/her own item:
    if (cartQuantitytoBeUpdated?.userId !== loggedInUser) {
      throw new BadRequestException(
        "You are not authorized to update this cart",
        ErrorCode.UNAUTHORIZED
      );
    }

    // update cart
    const updatedCart = await prismaClient.cartItem.update({
      where: {
        id: +req.params.id,
      },
      data: {
        quantity: validatedData.quantity,
      },
    });
    res.json(updatedCart);
  } catch (error: any) {
    res.json({ error: error.message });
  }
  //   const validatedData = ChangeOuantitySchema.parse(req.body);
};

export const getCart = async (req: Request, res: Response) => {
  const cart = await prismaClient.cartItem.findMany({
    where: {
      userId: req.user.id,
    },
    include: {
      product: true,
    },
  });
  res.json({ count: cart.length, cart });
};

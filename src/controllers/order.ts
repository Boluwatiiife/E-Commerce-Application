import { Request, Response } from "express";
import { prismaClient } from "..";
import { BadRequestException } from "../exceptions/bad_request";
import { ErrorCode } from "../exceptions/root";

export const createOrder = async (req: Request, res: Response) => {
  try {
    // 1. create a transaction
    return await prismaClient.$transaction(async (tx) => {
      const cartitems = await tx.cartItem.findMany({
        where: {
          userId: req.user.id,
        },
        include: {
          product: true,
        },
      });
      // 2. list all the cart items and proceed if cart is not empty
      if (cartitems.length === 0) {
        return res.json({ message: "cart is empty" });
      }
      // 3. calculate the total amount
      const price = cartitems.reduce((prev, current) => {
        return prev + current.quantity * +current.product.price;
      }, 0);
      // 4. retrieve the address of the user
      const address = await tx.address.findFirst({
        where: {
          id: req.user.defaultShippingAddress,
        },
      });
      // 5. define computed field for formated address on address model
      // 6. create order and order products
      const order = await tx.order.create({
        data: {
          userId: req.user.id,
          netAmount: price,
          address: address?.formattedAddress,
          products: {
            create: cartitems.map((cart) => {
              return {
                productId: cart.productId,
                quantity: cart.quantity,
              };
            }),
          },
        },
      });
      // 7. create events
      const orderEvent = await tx.orderEvent.create({
        data: {
          orderId: order.id,
        },
      });
      // 8. empty the cart
      await tx.cartItem.deleteMany({
        where: {
          userId: req.user.id,
        },
      });
      return res.json(order);
    });
  } catch (error: any) {
    res.json(error.message);
  }
};

export const listOrders = async (req: Request, res: Response) => {
  const orders = await prismaClient.order.findMany({
    where: {
      userId: req.user.id,
    },
  });
  res.json(orders);
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    let loggedInUser = req.user.id;
    let orderId = +req.params.id;

    const orderToBeCancelled = await prismaClient.order.findFirst({
      where: { id: orderId },
    });

    //check if order exists
    if (!orderToBeCancelled) {
      return res.status(404).json({ message: "Order not found!" });
    }

    // check if user is deleting his/her own item:
    if (orderToBeCancelled?.userId !== loggedInUser) {
      return res.status(401).json({
        status: "FAILED",
        message: "this is not your order, run along!",
      });
      // throw new BadRequestException(
      //   "You are not authorized to cancel this order, it doesnt belong to you",
      //   ErrorCode.UNAUTHORIZED
      // );
    }

    // cancel order
    const order = await prismaClient.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: "CANCELLED",
      },
    });
    await prismaClient.orderEvent.create({
      data: {
        orderId: order.id,
        status: "CANCELLED",
      },
    });
    res.json({ Yo: `${req.user.name}...You have cancelled this order`, order });
  } catch (error: any) {
    res.json(error.message);
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    let orderId = +req.params.id;

    const order = await prismaClient.order.findFirstOrThrow({
      where: {
        id: orderId,
      },
      include: {
        products: true,
        events: true,
      },
    });
    res.json(order);
  } catch (error: any) {
    res.json(error.message);
  }
};

export const listAllOrders = async (req: Request, res: Response) => {
  let whereClause = {};
  const status = req.query.status;
  if (status) {
    whereClause = {
      status,
    };
  }
  const orders = await prismaClient.order.findMany({
    where: whereClause,
    skip: +req.query.skip || 0,
    take: 5,
  });
  res.json(orders);
};

export const changeStatus = async (req: Request, res: Response) => {
  try {
    let orderId = +req.params.id;

    const order = await prismaClient.order.update({
      where: {
        id: +req.params.id,
      },
      data: {
        status: req.body.status,
      },
    });
    await prismaClient.orderEvent.create({
      data: {
        orderId: order.id,
        status: req.body.status,
      },
    });
    res.json(order);
  } catch (error: any) {
    res.json(error.message);
  }
};

export const listUserOrders = async (req: Request, res: Response) => {
  let whereClause: any = {
    userId: +req.params.id,
  };
  const status = req.params.status;
  if (status) {
    whereClause = {
      ...whereClause,
      status,
    };
  }
  const orders = await prismaClient.order.findMany({
    where: whereClause,
    skip: +req.query.skip || 0,
    take: 5,
  });
  res.json({ count: orders.length, orders });
};

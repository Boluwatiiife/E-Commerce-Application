import { Router } from "express";
import authMiddleware from "../middleware/auth";
import { errorHandler } from "../error_handler";
import {
  addItemToCart,
  changeOuantity,
  deleteItemFromCart,
  getCart,
} from "../controllers/cart";

const cartRoutes: Router = Router();

cartRoutes.post("/", [authMiddleware], errorHandler(addItemToCart));
cartRoutes.get("/", [authMiddleware], errorHandler(getCart));
cartRoutes.delete("/:id", [authMiddleware], errorHandler(deleteItemFromCart));
cartRoutes.put("/:id", [authMiddleware], errorHandler(changeOuantity));

export default cartRoutes;

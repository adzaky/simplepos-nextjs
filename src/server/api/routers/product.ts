import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { supabaseAdmin } from "@/server/supabase-admin";
import { Bucket } from "@/server/bucket";
import { TRPCError } from "@trpc/server";

export const ProductRouter = createTRPCRouter({
  getProducts: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;

    const product = await db.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        imageUrl: true,
      },
    });

    return product;
  }),

  createProduct: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3).max(50),
        price: z.coerce.number().min(1000),
        categoryId: z.string(),
        imageUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      const newProduct = await db.product.create({
        data: {
          name: input.name,
          price: input.price,
          category: {
            connect: {
              id: input.categoryId,
            },
          },
          imageUrl: input.imageUrl,
        },
      });

      return newProduct;
    }),

  createProductImageUploadSignedUrl: protectedProcedure.mutation(async () => {
    const { data, error } = await supabaseAdmin.storage
      .from(Bucket.ProductImages)
      .createSignedUploadUrl(`${Date.now()}.jpeg`);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    return data;
  }),

  deleteProduct: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      const deletedProduct = await db.product.delete({
        where: {
          id: input.productId,
        },
      });

      return deletedProduct;
    }),

  editProduct: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        name: z.string().min(3).max(50),
        price: z.coerce.number().min(1000),
        categoryId: z.string(),
        imageUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      const editedProduct = await db.product.update({
        where: {
          id: input.productId,
        },
        data: {
          name: input.name,
          price: input.price,
          category: {
            connect: {
              id: input.categoryId,
            },
          },
          imageUrl: input.imageUrl,
        },
        select: {
          id: true,
          name: true,
          price: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          imageUrl: true,
        },
      });

      return editedProduct;
    }),
});

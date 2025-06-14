import {
  DashboardDescription,
  DashboardHeader,
  DashboardLayout,
  DashboardTitle,
} from "@/components/layouts/DashboardLayout";
import type { NextPageWithLayout } from "../_app";
import { useState, type ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { ProductCatalogCard } from "@/components/shared/product/ProductCatalogCard";
import { api } from "@/utils/api";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProductForm } from "@/components/shared/product/ProductForm";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { productFormSchema, type ProductFormSchema } from "@/forms/product";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product } from "@prisma/client";

const ProductsPage: NextPageWithLayout = () => {
  const apiUtils = api.useUtils();

  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [createProductDialogOpen, setCreateProductDialogOpen] = useState(false);
  const [editProductDialogOpen, setEditProductDialogOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [productToEdit, setProductToEdit] = useState<Omit<
    Product,
    "createdAt" | "updatedAt"
  > | null>(null);

  const createProductForm = useForm<ProductFormSchema>({
    resolver: zodResolver(productFormSchema),
  });

  const editProductForm = useForm<ProductFormSchema>({
    resolver: zodResolver(productFormSchema),
    values: {
      name: productToEdit?.name ?? "",
      price: productToEdit?.price ?? 0,
      categoryId: productToEdit?.categoryId ?? "",
      imageUrl: productToEdit?.imageUrl ?? "",
    },
  });

  const { data: product } = api.product.getProducts.useQuery({
    categoryId: selectedCategory,
  });

  const { data: categories } = api.category.getCategories.useQuery();

  const { mutate: createProduct, isPending: isCreateProductPending } =
    api.product.createProduct.useMutation({
      onSuccess: async () => {
        await apiUtils.product.getProducts.invalidate();

        toast("Product created successfully!");
        setCreateProductDialogOpen(false);
        setUploadedImageUrl(null);
        createProductForm.reset();
      },
    });

  const { mutate: deleteProductById, isPending: isDeleteProductPending } =
    api.product.deleteProduct.useMutation({
      onSuccess: async () => {
        await apiUtils.product.getProducts.invalidate();

        toast("Product deleted successfully!");
        setProductToDelete(null);
      },
    });

  const { mutate: editProduct, isPending: isEditProductPending } =
    api.product.editProduct.useMutation({
      onSuccess: async () => {
        await apiUtils.product.getProducts.invalidate();

        toast("Product edited successfully!");
        setEditProductDialogOpen(false);
        editProductForm.reset();
      },
    });

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleSubmitCreateProduct = (values: ProductFormSchema) => {
    if (!uploadedImageUrl) {
      toast("Upload product image first!");
      return;
    }

    createProduct({
      ...values,
      imageUrl: uploadedImageUrl,
    });
  };

  const handleSubmitEditProduct = (data: ProductFormSchema) => {
    if (!productToEdit) return;

    if (!uploadedImageUrl) {
      toast("Upload product image first!");
      return;
    }

    editProduct({
      ...data,
      productId: productToEdit.id,
      imageUrl: uploadedImageUrl,
    });
  };

  const handleClickEditProduct = (
    product: Omit<Product, "createdAt" | "updatedAt">,
  ) => {
    setProductToEdit(product);
    setEditProductDialogOpen(true);
  };

  const handleClickDeleteProduct = (productId: string) => {
    setProductToDelete(productId);
  };

  const handleConfirmDeleteProduct = () => {
    if (!productToDelete) return;

    deleteProductById({ productId: productToDelete });
  };

  return (
    <>
      <DashboardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <DashboardTitle>Product Management</DashboardTitle>
            <DashboardDescription>
              View, add, edit, and delete products in your inventory.
            </DashboardDescription>
          </div>
          <AlertDialog
            open={createProductDialogOpen}
            onOpenChange={setCreateProductDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <div className="flex items-center gap-2">
                <Select defaultValue="ALL" onValueChange={handleCategoryClick}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="ALL">ALL CATEGORY</SelectItem>
                    {categories?.map((category) => {
                      return (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button>Add New Product</Button>
              </div>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>Create Product</AlertDialogHeader>
              <Form {...createProductForm}>
                <ProductForm
                  onSubmit={handleSubmitCreateProduct}
                  onChangeImageUrl={(imageUrl) => setUploadedImageUrl(imageUrl)}
                />
              </Form>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => createProductForm.reset()}>
                  Cancel
                </AlertDialogCancel>
                <Button
                  type="submit"
                  form="product-form"
                  onClick={createProductForm.handleSubmit(
                    handleSubmitCreateProduct,
                  )}
                  loading={isCreateProductPending}
                >
                  Create
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {product?.map((product) => (
          <ProductCatalogCard
            key={product.id}
            name={product.name}
            price={product.price}
            image={product.imageUrl ?? ""}
            category={product.category.name}
            onEdit={() =>
              handleClickEditProduct({
                id: product.id,
                name: product.name,
                price: product.price,
                categoryId: product.category.id,
                imageUrl: product.imageUrl ?? "",
              })
            }
            onDelete={() => handleClickDeleteProduct(product.id)}
          />
        ))}
      </div>

      <AlertDialog
        open={editProductDialogOpen}
        onOpenChange={setEditProductDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Product</AlertDialogTitle>
          </AlertDialogHeader>
          <Form {...editProductForm}>
            <ProductForm
              onSubmit={handleSubmitEditProduct}
              onChangeImageUrl={(imageUrl) => setUploadedImageUrl(imageUrl)}
            />
          </Form>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => editProductForm.reset()}>
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={editProductForm.handleSubmit(handleSubmitEditProduct)}
              loading={isEditProductPending}
            >
              Edit Product
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!productToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setProductToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to delete this product? This action cannot be
            undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteProduct}
              loading={isDeleteProductPending}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

ProductsPage.getLayout = (page: ReactElement) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default ProductsPage;

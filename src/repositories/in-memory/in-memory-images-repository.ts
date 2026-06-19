import type { Image } from "../../../generated/prisma";
import type {
  CreateImageData,
  ImagesRepository,
  UpdateImageData,
} from "@/repositories/images-repository";

export class InMemoryImagesRepository implements ImagesRepository {
  // Seed the products and variants the images can attach to.
  public products: { id: number }[] = [];
  public variants: { id: number; product_id: number }[] = [];
  public items: Image[] = [];
  private nextId = 1;

  async create(productId: number, data: CreateImageData) {
    if (!this.products.some((p) => p.id === productId)) return null;

    if (data.variant_id != null) {
      const variant = this.variants.find((v) => v.id === data.variant_id);
      if (!variant || variant.product_id !== productId) return null;
    }

    const image: Image = {
      id: this.nextId++,
      product_id: productId,
      variant_id: data.variant_id ?? null,
      url: data.url,
      alt_text: data.alt_text ?? null,
      position: data.position ?? 0,
    };
    this.items.push(image);
    return image;
  }

  async update(id: number, data: UpdateImageData) {
    const image = this.items.find((item) => item.id === id);
    if (!image) return null;

    if (data.variant_id !== undefined) image.variant_id = data.variant_id;
    if (data.alt_text !== undefined) image.alt_text = data.alt_text;
    if (data.position !== undefined) image.position = data.position;

    return image;
  }

  async delete(id: number) {
    const index = this.items.findIndex((item) => item.id === id);
    if (index < 0) return false;
    this.items.splice(index, 1);
    return true;
  }
}

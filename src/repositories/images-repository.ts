import type { Image } from "../../generated/prisma";

export interface CreateImageData {
  url: string;
  variant_id?: number | null;
  alt_text?: string | null;
  position?: number;
}

export interface UpdateImageData {
  variant_id?: number | null;
  alt_text?: string | null;
  position?: number;
}

export interface ImagesRepository {
  // null when the product is missing or variant_id doesn't belong to it
  create(productId: number, data: CreateImageData): Promise<Image | null>;
  update(id: number, data: UpdateImageData): Promise<Image | null>;
  delete(id: number): Promise<boolean>;
}

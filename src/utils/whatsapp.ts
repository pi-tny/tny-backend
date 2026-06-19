import type { OrderDetail } from "@/repositories/orders-repository";

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2)}`;
}

// Builds the human-readable order message sent to the store via WhatsApp.
export function buildWhatsappMessage(order: OrderDetail): string {
  const lines = [
    `Olá! Gostaria de fazer um pedido (#${order.id}):`,
    "",
    ...order.items.map(
      (item) =>
        `- ${item.quantity}x ${item.product_name} (${item.color}/${item.size}) — ${formatBRL(item.unit_price)}`,
    ),
    "",
    `Total: ${formatBRL(order.total)}`,
    `Nome: ${order.name}`,
    `Telefone: ${order.phone}`,
  ];
  return lines.join("\n");
}

// wa.me deep link; number is digits-only (may be empty to let the user choose).
export function buildWhatsappLink(order: OrderDetail, number: string) {
  const message = buildWhatsappMessage(order);
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  return { whatsapp_message: message, whatsapp_url: url };
}

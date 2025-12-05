/**
 * Componente de botones para exportación de datos de ventas
 * 
 * Proporciona botones para exportar datos a Excel y PDF
 * 
 * @module features/dashboard/modules/sells/ui
 */

"use client";
import { FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Sale } from "../schemas/sell.schema";
import { formatDate, calculateTotalRevenue, calculateOrderTotal, groupProductsByName } from "../utils/sell.utils";

// Extender la definición del módulo jsPDF para incluir autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

/**
 * Props para el componente ExportButtons
 */
interface ExportButtonsProps {
  /** Ventas filtradas a exportar */
  filteredSells: Sale[];
  /** Modo de vista actual (orders o products) */
  viewMode: "orders" | "products";
  /** Nombre de la tienda */
  name: string;
}

/**
 * Componente de botones para exportar datos de ventas a Excel y PDF
 * 
 * @param props - Propiedades del componente
 * @returns Componente React
 */
const ExportButtons: React.FC<ExportButtonsProps> = ({ 
  filteredSells, 
  viewMode, 
  name 
}) => {
  /**
   * Exporta los datos de ventas a un archivo Excel
   */
  const exportToExcel = () => {
    const totalRevenue = calculateTotalRevenue(filteredSells);
    const totalOrders = filteredSells.length;
    const totalProducts = filteredSells.reduce(
      (acc, sell) => acc + sell.items.length, 
      0
    );

    // Crear el libro de Excel
    const wb = XLSX.utils.book_new();

    if (viewMode === "orders") {
      // Hoja de resumen para pedidos
      const summaryData = [
        ["Reporte de Pedidos"],
        ["Fecha de generación:", new Date().toLocaleString("es-AR")],
        ["Nombre del Local:", name || "Mi Tienda"],
        [""],
        ["Resumen"],
        ["Total de Pedidos:", totalOrders],
        ["Ingresos Totales:", `$${totalRevenue.toFixed(2)}`],
        [""],
        ["Detalle de Pedidos"]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Resumen");

      // Hoja de pedidos
      const ordersData = filteredSells.map(sell => ({
        Cliente: sell.customer.name,
        Fecha: formatDate(sell.metadata.createdAt),
        "Método de entrega": sell.delivery.method,
        "Método de pago": sell.payment.method,
        Total: calculateOrderTotal(sell)
      }));

      const ordersSheet = XLSX.utils.json_to_sheet(ordersData);
      XLSX.utils.book_append_sheet(wb, ordersSheet, "Pedidos");

      // Agregar totales al final
      const totalRow = [{
        Cliente: "TOTAL",
        Fecha: "",
        "Método de entrega": "",
        "Método de pago": "",
        Total: totalRevenue
      }];
      XLSX.utils.sheet_add_json(ordersSheet, totalRow, { origin: -1 });

      XLSX.writeFile(wb, `reporte_pedidos_${new Date().toISOString().split("T")[0]}.xlsx`);
    } else {
      // Hoja de resumen para productos
      const summaryData = [
        ["Reporte de Productos más Vendidos"],
        ["Fecha de generación:", new Date().toLocaleString("es-AR")],
        ["Nombre del Local:", name || "Mi Tienda"],
        [""],
        ["Resumen"],
        ["Total de Productos Vendidos:", totalProducts],
        ["Ingresos Totales:", `$${totalRevenue.toFixed(2)}`],
        [""],
        ["Detalle de Productos"]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Resumen");

      // Agrupar productos por nombre
      const productStats = groupProductsByName(filteredSells);

      // Convertir a array y ordenar por cantidad
      const productsData = Object.values(productStats)
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .map(product => ({
          Producto: product.name,
          Cantidad: product.totalQuantity,
          Ingresos: `$${product.totalRevenue.toFixed(2)}`
        }));

      const productsSheet = XLSX.utils.json_to_sheet(productsData);
      XLSX.utils.book_append_sheet(wb, productsSheet, "Productos");

      XLSX.writeFile(wb, `reporte_productos_${new Date().toISOString().split("T")[0]}.xlsx`);
    }
  };

  /**
   * Exporta los datos de ventas a un archivo PDF
   */
  const exportToPDF = () => {
    const doc = new jsPDF();
    const totalRevenue = calculateTotalRevenue(filteredSells);
    const totalOrders = filteredSells.length;
    const totalProducts = filteredSells.reduce(
      (acc, sell) => acc + sell.items.length, 
      0
    );

    // Agregar encabezado
    doc.setFontSize(20);
    doc.text(
      viewMode === "orders" 
        ? "Reporte de Pedidos" 
        : "Reporte de Productos más Vendidos", 
      14, 
      15
    );

    doc.setFontSize(12);
    doc.text(`Fecha de generación: ${new Date().toLocaleString("es-AR")}`, 14, 25);
    doc.text(`Nombre del Local: ${name || "Mi Tienda"}`, 14, 35);

    // Agregar resumen
    doc.setFontSize(14);
    doc.text("Resumen", 14, 50);
    doc.setFontSize(12);
    
    if (viewMode === "orders") {
      doc.text(`Total de Pedidos: ${totalOrders}`, 14, 60);
      doc.text(`Ingresos Totales: $${totalRevenue.toFixed(2)}`, 14, 70);
    } else {
      doc.text(`Total de Productos Vendidos: ${totalProducts}`, 14, 60);
      doc.text(`Ingresos Totales: $${totalRevenue.toFixed(2)}`, 14, 70);
    }

    // Agregar tabla de datos
    let data;
    let headers;

    if (viewMode === "orders") {
      data = filteredSells.map(sell => [
        sell.customer.name,
        formatDate(sell.metadata.createdAt),
        sell.delivery.method,
        sell.payment.method,
        `$${calculateOrderTotal(sell).toFixed(2)}`
      ]);
      headers = [["Cliente", "Fecha", "Método de entrega", "Método de pago", "Total"]];
    } else {
      // Agrupar productos por nombre
      const productStats = groupProductsByName(filteredSells);

      // Convertir a array y ordenar por cantidad
      data = Object.values(productStats)
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .map(product => [
          product.name,
          product.totalQuantity.toString(),
          `$${product.totalRevenue.toFixed(2)}`
        ]);
      headers = [["Producto", "Cantidad", "Ingresos"]];
    }

    autoTable(doc, {
      head: headers,
      body: data,
      theme: "grid",
      startY: 80,
      headStyles: { fillColor: [97, 87, 147] }
    });

    doc.save(`reporte_${viewMode === "orders" ? "pedidos" : "productos"}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="flex flex-wrap gap-4">
      <button
        onClick={exportToExcel}
        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        aria-label="Exportar a Excel"
      >
        <FileSpreadsheet className="w-5 h-5" />
        Exportar a Excel
      </button>
      <button
        onClick={exportToPDF}
        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        aria-label="Exportar a PDF"
      >
        <FileText className="w-5 h-5" />
        Exportar a PDF
      </button>
    </div>
  );
};

export default ExportButtons;

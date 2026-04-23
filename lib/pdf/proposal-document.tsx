import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type ProposalPdfPayload = {
  quoteNumber: string;
  clientName: string;
  projectName: string;
  currency: string;
  createdAt: string;
  notes?: string;
  items: Array<{
    itemName: string;
    itemDescription: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  marginAmount: number;
  total: number;
};

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  header: {
    marginBottom: 16,
    borderBottom: "1 solid #94a3b8",
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0b66ff",
    marginBottom: 4,
  },
  subTitle: {
    color: "#334155",
  },
  section: {
    marginTop: 12,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  tableHeader: {
    display: "flex",
    flexDirection: "row",
    borderBottom: "1 solid #cbd5e1",
    marginTop: 10,
    paddingBottom: 6,
    fontWeight: "bold",
  },
  tableRow: {
    display: "flex",
    flexDirection: "row",
    borderBottom: "1 solid #e2e8f0",
    paddingVertical: 6,
  },
  colWide: {
    width: "46%",
    paddingRight: 8,
  },
  col: {
    width: "18%",
  },
  totals: {
    marginTop: 14,
    alignSelf: "flex-end",
    width: "45%",
  },
  totalLine: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  grandTotal: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 6,
    color: "#0b66ff",
  },
});

export function ProposalDocument({ payload }: { payload: ProposalPdfPayload }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Ultra Frame - Project Proposal</Text>
          <Text style={styles.subTitle}>Engineering-Grade Aluminum, Steel, and Glass Solutions</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text>Quote Number: {payload.quoteNumber}</Text>
            <Text>Date: {payload.createdAt}</Text>
          </View>
          <View style={styles.row}>
            <Text>Client: {payload.clientName}</Text>
            <Text>Project: {payload.projectName}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colWide}>Scope Item</Text>
          <Text style={styles.col}>Qty</Text>
          <Text style={styles.col}>Unit Price</Text>
          <Text style={styles.col}>Total</Text>
        </View>

        {payload.items.map((item, index) => (
          <View style={styles.tableRow} key={`${item.itemName}-${index}`}>
            <View style={styles.colWide}>
              <Text>{item.itemName}</Text>
              <Text>{item.itemDescription}</Text>
            </View>
            <Text style={styles.col}>
              {item.quantity} {item.unit}
            </Text>
            <Text style={styles.col}>
              {payload.currency} {item.unitPrice.toFixed(2)}
            </Text>
            <Text style={styles.col}>
              {payload.currency} {item.totalPrice.toFixed(2)}
            </Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalLine}>
            <Text>Subtotal</Text>
            <Text>
              {payload.currency} {payload.subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalLine}>
            <Text>Margin</Text>
            <Text>
              {payload.currency} {payload.marginAmount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.grandTotal}>Total Proposal</Text>
            <Text style={styles.grandTotal}>
              {payload.currency} {payload.total.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text>Notes / Terms</Text>
          <Text>{payload.notes ?? "Final measurements and site conditions will be confirmed before execution."}</Text>
        </View>
      </Page>
    </Document>
  );
}



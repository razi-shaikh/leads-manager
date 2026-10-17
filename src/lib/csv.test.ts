import { describe, expect, it } from "vitest";

import { parseLeadCsv } from "./csv";

const HEADER =
  "ID,Lead Source,Date,Customer Name,Phone,Email,Brand & Model,Reg No.,Year,Bike Photo (Multiple photos),KM Driven,No. of Owners,Location,Expected Price";

const VALID_CSV = [
  HEADER,
  'L1,BikeBecho.com,2026-10-15,Arun Kumar,9876543210,arun@example.com,Royal Enfield Classic 350,KA-05-AB-1234,2021,"https://img.test/a.jpg, https://img.test/b.jpg","18,500",1,Bengaluru,"1,65,000"',
  "L2,Facebook,not-a-date,Priya,,,Yamaha MT-15,MH-12-CD-5678,22,https://img.test/c.jpg,,2,Pune,",
].join("\n");

describe("parseLeadCsv", () => {
  it("parses valid rows and transforms types", () => {
    const result = parseLeadCsv(VALID_CSV);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toHaveLength(2);

    const [first, second] = result.rows;
    expect(first.customerName).toBe("Arun Kumar");
    expect(first.photos).toEqual(["https://img.test/a.jpg", "https://img.test/b.jpg"]);
    expect(first.kmDriven).toBe(18500);
    expect(first.expectedPrice).toBe(165000);
    expect(first.year).toBe(2021);
    expect(first.leadDate).toBeInstanceOf(Date);
    expect(first.status).toBe("new_lead");

    // Lenient coercions: bad date -> null, 2-digit year -> null, blanks -> null/""
    expect(second.leadDate).toBeNull();
    expect(second.year).toBeNull();
    expect(second.email).toBe("");
    expect(second.kmDriven).toBeNull();
    expect(second.expectedPrice).toBeNull();
    expect(second.photos).toEqual(["https://img.test/c.jpg"]);
  });

  it("accepts partial columns and defaults the missing fields", () => {
    const result = parseLeadCsv("Customer Name,Phone,Expected Price\nArun,98765,150000");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toHaveLength(1);
    const [row] = result.rows;
    expect(row.customerName).toBe("Arun");
    expect(row.phone).toBe("98765");
    expect(row.expectedPrice).toBe(150000);
    expect(row.email).toBe("");
    expect(row.brandModel).toBe("");
    expect(row.year).toBeNull();
    expect(row.photos).toEqual([]);
    expect(row.status).toBe("new_lead");
  });

  it("rejects files with no recognized columns and creates nothing", () => {
    const result = parseLeadCsv("Name,Mobile\nArun,123");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fileError).toContain("No recognized columns");
  });

  it("ignores blank lines between rows", () => {
    const csv = ["Customer Name,Phone", "Arun,98765", ",", "", "   "].join("\n");
    const result = parseLeadCsv(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toHaveLength(1);
  });

  it("rejects empty files", () => {
    expect(parseLeadCsv("   ").ok).toBe(false);
    expect(parseLeadCsv("\uFEFF" + HEADER + "\n").ok).toBe(false); // header only, no rows
  });

  it("tolerates a BOM and extra whitespace", () => {
    const csv = "\uFEFF" + VALID_CSV;
    const result = parseLeadCsv(csv);
    expect(result.ok).toBe(true);
  });
});

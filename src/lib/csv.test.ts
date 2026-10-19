import { describe, expect, it } from "vitest";

import { parseBboCsv, parseLeadCsv } from "./csv";

const HEADER =
  "ID,Lead Source,Date,Customer Name,Phone,Email,Brand & Model,Reg No.,Year,Bike Photo (Multiple photos),KM Driven,No. of Owners,Location,Expected Price";

const VALID_CSV = [
  HEADER,
  'L1,BikeBecho,2026-10-15,Arun Kumar,9876543210,arun@example.com,Royal Enfield Classic 350,KA-05-AB-1234,2021,"https://img.test/a.jpg, https://img.test/b.jpg","18,500",1,Bengaluru,"1,65,000"',
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

  it("imports Our Price when present and nulls it when missing", () => {
    const withPrice = parseLeadCsv('Customer Name,Our Price\nArun,"1,50,000"');
    expect(withPrice.ok).toBe(true);
    if (!withPrice.ok) return;
    expect(withPrice.rows[0].ourPrice).toBe(150000);

    const withoutPrice = parseLeadCsv("Customer Name,Phone\nArun,98765");
    expect(withoutPrice.ok).toBe(true);
    if (!withoutPrice.ok) return;
    expect(withoutPrice.rows[0].ourPrice).toBeNull();
  });
});

describe("parseBboCsv", () => {
  const BBO_CSV = [
    "ID,Submitted At,Owner Name,Mobile Number,Email,City,PIN Code,Brand,Model,Variant,Manufacturing Year,Kilometers Driven,Ownership,Bike Condition,Expected Price",
    '191,10/19/2026 7:15,Nimesh Ambekar,9022166054,nimesh@example.com,Mumbai,400002,Honda,Hornet 160,Standard,2016,0,1st Owner,Good,45000',
    "190,10/19/2026 7:10,Vipul Sawant,9029033838,,Mumbai,,KTM,Duke 390,Abs,2019,12000,Second,Excellent,180000",
  ].join("\n");

  it("maps BikeBecho columns onto lead fields", () => {
    const result = parseBboCsv(BBO_CSV);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toHaveLength(2);

    const [first, second] = result.rows;
    expect(first.externalId).toBe("191");
    expect(first.source).toBe("BikeBecho");
    expect(first.leadDate).toBeInstanceOf(Date);
    expect(first.customerName).toBe("Nimesh Ambekar");
    expect(first.phone).toBe("9022166054");
    expect(first.brandModel).toBe("Honda Hornet 160 Standard");
    expect(first.location).toBe("Mumbai, 400002");
    expect(first.year).toBe(2016);
    expect(first.kmDriven).toBe(0);
    expect(first.owners).toBe(1);
    expect(first.regNo).toBe("(Good)");
    expect(first.expectedPrice).toBe(45000);
    expect(first.status).toBe("new_lead");

    expect(second.email).toBe("");
    expect(second.location).toBe("Mumbai");
    expect(second.owners).toBe(2);
    expect(second.regNo).toBe("(Excellent)");
  });

  it("appends the condition to a present registration number, either spelling", () => {
    const legacy = parseBboCsv("Mobile Number,Reg No.,Bike Condition\n98765,KA-01-AB-1234,Good");
    expect(legacy.ok).toBe(true);
    if (!legacy.ok) return;
    expect(legacy.rows[0].regNo).toBe("KA-01-AB-1234 (Good)");

    const future = parseBboCsv("Mobile Number,RegestrationNo,Bike Condition\n98765,MH-12-CD-5678,Excellent");
    expect(future.ok).toBe(true);
    if (!future.ok) return;
    expect(future.rows[0].regNo).toBe("MH-12-CD-5678 (Excellent)");
  });

  it("reads the abbreviated Exp. Price header", () => {
    const result = parseBboCsv("Mobile Number,Exp. Price\n98765,150000");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows[0].expectedPrice).toBe(150000);
  });

  it("maps the BBO column onto the lead source, defaulting to BikeBecho", () => {
    const outlet = parseBboCsv("Mobile Number,BBO\n98765,BikeBecho Pune");
    expect(outlet.ok).toBe(true);
    if (!outlet.ok) return;
    expect(outlet.rows[0].source).toBe("BikeBecho Pune");

    const marker = parseBboCsv("Mobile Number,BBO\n98765,BBO");
    expect(marker.ok).toBe(true);
    if (!marker.ok) return;
    expect(marker.rows[0].source).toBe("BikeBecho");

    const missing = parseBboCsv("Mobile Number,Brand\n98765,Honda");
    expect(missing.ok).toBe(true);
    if (!missing.ok) return;
    expect(missing.rows[0].source).toBe("BikeBecho");
  });

  it("rejects non-BikeBecho files even when a column overlaps", () => {
    const result = parseBboCsv("Customer Name,Phone,Email\nArun,98765,a@b.c");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fileError).toContain("BikeBecho");
  });
});

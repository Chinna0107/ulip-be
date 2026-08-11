const { pool } = require('./src/database');

async function seedORE() {
  const columns = [
    { header: "Division", accessor: "division" },
    { header: "Reference No", accessor: "reference_no" },
    { header: "Indent Date", accessor: "indent_date" },
    { header: "Indentor Name", accessor: "indentor_name" },
    { header: "Details of items", accessor: "details_of_items" },
    { header: "Vendor Details", accessor: "vendor_details" },
    { header: "Pack Size", accessor: "pack_size" },
    { header: "Qty", accessor: "qty" },
    { header: "Rate", accessor: "rate" },
    { header: "Estimated cost", accessor: "estimated_cost" },
    { header: "GST", accessor: "gst" },
    { header: "Grand Total", accessor: "grand_total" }
  ];

  try {
    await pool.query("DELETE FROM sheet_columns WHERE sheet_name = $1", ["ORE"]);
    await pool.query(
      "INSERT INTO sheet_columns (sheet_name, columns) VALUES ($1, $2)",
      ["ORE", JSON.stringify(columns)]
    );
    console.log("ORE columns updated successfully.");
  } catch (err) {
    console.error("Error inserting ORE columns:", err);
  } finally {
    process.exit(0);
  }
}

seedORE();

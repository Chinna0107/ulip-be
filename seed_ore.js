const { pool } = require('./src/database');

async function seedORE() {
  const columns = [
    { header: "Commit No", accessor: "commit_no" },
    { header: "Dept Name", accessor: "dept_name" },
    { header: "Indent No", accessor: "indent_no" },
    { header: "Date", accessor: "date" },
    { header: "Indentor", accessor: "indentor" },
    { header: "Name", accessor: "name" },
    { header: "Item Details", accessor: "item_details" },
    { header: "Qty", accessor: "qty" },
    { header: "Rate", accessor: "rate" },
    { header: "GST", accessor: "gst" },
    { header: "Grand Total", accessor: "grand_total" }
  ];

  try {
    const existing = await pool.query("SELECT * FROM sheet_columns WHERE sheet_name = $1", ["ORE"]);
    if (existing.rows.length === 0) {
      await pool.query(
        "INSERT INTO sheet_columns (sheet_name, columns) VALUES ($1, $2)",
        ["ORE", JSON.stringify(columns)]
      );
      console.log("Successfully added ORE columns to database.");
    } else {
      console.log("ORE columns already exist in database.");
    }
  } catch (err) {
    console.error("Error inserting ORE columns:", err);
  } finally {
    process.exit(0);
  }
}

seedORE();

require('dotenv').config();
const xlsx = require('xlsx');
const path = require('path');
const { initDB, pool } = require('./database');

const excelPath = path.resolve(__dirname, '../../ulip/src/assets/ULIP Budget.xlsx');

const seedDB = async () => {
  try {
    await initDB();
    
    console.log("Reading Excel File...");
    let workbook;
    try {
      workbook = xlsx.readFile(excelPath);
    } catch (err) {
      console.error("Could not find excel file at", excelPath);
      process.exit(1);
    }

    const client = await pool.connect();
    
    try {
      await client.query("BEGIN");
      
      // Clear existing data
      await client.query("DELETE FROM records");
      await client.query("DELETE FROM sheet_columns");

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        if (jsonData.length === 0) continue;

        let headerRowIndex = 0;
        if (jsonData.length > 1) {
          const row0 = jsonData[0].filter(Boolean);
          const row1 = jsonData[1].filter(Boolean);
          if (row1.length > row0.length) {
            headerRowIndex = 1;
          }
        }

        const headers = jsonData[headerRowIndex] || [];
        const columns = [];
        const validHeaderIndices = [];
        
        headers.forEach((header, index) => {
          if (header && String(header).trim() !== '') {
            columns.push({
              header: String(header).trim(),
              accessor: `col_${index}`
            });
            validHeaderIndices.push(index);
          }
        });

        // Insert columns configuration
        await client.query(
          "INSERT INTO sheet_columns (sheet_name, columns) VALUES ($1, $2)",
          [sheetName, JSON.stringify(columns)]
        );

        // Extract and insert data rows
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0 || row.every(val => val == null || String(val).trim() === '')) {
            continue;
          }
          
          const rowData = {};
          let hasData = false;
          
          validHeaderIndices.forEach(colIndex => {
            const val = row[colIndex];
            if (val != null && String(val).trim() !== '') {
              rowData[`col_${colIndex}`] = val;
              hasData = true;
            }
          });

          if (hasData) {
            await client.query(
              "INSERT INTO records (sheet_name, data) VALUES ($1, $2)",
              [sheetName, JSON.stringify(rowData)]
            );
          }
        }
      }
      
      await client.query("COMMIT");
      console.log("Database seeded successfully to Neon DB.");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await pool.end();
  }
};

seedDB();

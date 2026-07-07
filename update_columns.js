const { pool } = require('./src/database');

async function updateColumns() {
  const sheetsToUpdate = [
    'C&C Indents',
    'Capital',
    'Manpower ',
    'TADA Indents'
  ];

  try {
    for (const sheet of sheetsToUpdate) {
      const result = await pool.query("SELECT columns FROM sheet_columns WHERE sheet_name = $1", [sheet]);
      if (result.rows.length > 0) {
        let columns = result.rows[0].columns;
        
        // Check if Commit No already exists
        const exists = columns.find(c => c.accessor === 'commit_no' || c.header === 'Commit No');
        if (!exists) {
          // Add Commit No at the beginning (index 0)
          columns.unshift({ header: 'Commit No', accessor: 'commit_no' });
          
          await pool.query(
            "UPDATE sheet_columns SET columns = $1 WHERE sheet_name = $2",
            [JSON.stringify(columns), sheet]
          );
          console.log(`Added Commit No to ${sheet}`);
        } else {
          console.log(`Commit No already exists in ${sheet}`);
        }
      } else {
        console.log(`Sheet not found in database: ${sheet}`);
      }
    }
  } catch (err) {
    console.error("Error updating columns:", err);
  } finally {
    process.exit(0);
  }
}

updateColumns();

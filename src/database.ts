import * as sqlite from "sqlite3"

const DB = new sqlite.Database(":plane_info:")

DB.serialize(() => {
    DB.run("CREATE TABLE lorem (info TEXT)");

    const stmt = DB.prepare("INSERT INTO lorem VALUES (?)");
    for (let i = 0; i < 10; i++) {
        stmt.run("Ipsum " + i);
    }
    stmt.finalize();

    DB.each("SELECT rowid AS id, info FROM lorem", (err, row: any) => {
        console.log(row.id + ": " + row.info);
    });
});

DB.close();
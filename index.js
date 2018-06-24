var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var oracledb = require('oracledb');


// USERS_NCORDERO TABLA DE USUARIOS
// COMPANY_NCORDERO TABLA DE EMPRESAS


app.use(bodyParser.json());
app.listen(3000);

var conn = {
    "user": "IMMDEV",
    "password": "Montevideo2016",
    "connectString": "kona-rds-dfc.cluc7dasqofp.us-west-2.rds.amazonaws.com:1521/ORCL"
}

//**************************************************************//
//******************** SCHEMA USERS_NCORDERO ******************//



// ****** GET ******

app.get('/users', function (req, res) {
    "use strict";

    oracledb.getConnection(conn, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute("SELECT * FROM USERS_NCORDERO", {}, {
            outFormat: oracledb.OBJECT // Return the result as Object
        }, function (err, result) {
            if (err) {
                res.set('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({
                    status: 500,
                    message: "Error getting the users",
                    detailed_message: err.message
                }));
            } else {
                res.contentType('application/json').status(200);
                res.send(JSON.stringify(result.rows));
            }
            // Release the connection
            connection.release(
                function (err) {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log("GET /users : Connection released");
                    }
                });
        });
    });
});

// *******  POST  ********

app.post('/users', function (req, res) {
    "use strict";
    if ("application/json" !== req.get('Content-Type')) {
        res.set('Content-Type', 'application/json').status(415).send(JSON.stringify({
            status: 415,
            message: "Wrong content-type. Only application/json is supported",
            detailed_message: null
        }));
        return;
    }
    oracledb.getConnection(conn, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json').status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }
        connection.execute("INSERT INTO USERS_NCORDERO VALUES " +
            "(:ID, :NAME, :EMAIL, :STATUS," +
            ":COMPANY_ID) ", [req.body.ID, req.body.NAME,
                            req.body.EMAIL, req.body.STATUS, req.body.COMPANY_ID], {
                autoCommit: true,
                outFormat: oracledb.OBJECT // Return the result as Object
            },
            function (err, result) {
                if (err) {
                    // Error
                    res.set('Content-Type', 'application/json');
                    res.status(400).send(JSON.stringify({
                        status: 400,
                        message: err.message.indexOf("ORA-00001") > -1 ? "User already exists" : "Input Error",
                        detailed_message: err.message
                    }));
                } else {
                    // Successfully created the resource
                    res.status(201).set('Location', '/users/' + req.body.NAME).end();
                }
                // Release the connection
                connection.release(
                    function (err) {
                        if (err) {
                            console.error(err.message);
                        } else {
                            console.log("POST /users : Connection released");
                        }
                    });
            });
    });
});


//******* PUT *********


var buildUpdateStatementUsers = function buildUpdateStatementUsers(req) {
    "use strict";

    var statement = "",
        bindValues = {};
    if (req.body.NAME) {
        statement += "NAME = :NAME";
        bindValues.NAME = req.body.NAME;
    }
    if (req.body.EMAIL) {
        if (statement) statement = statement + ", ";
        statement += "EMAIL = :EMAIL";
        bindValues.EMAIL = req.body.EMAIL;
    }
    if (req.body.STATUS) {
        if (statement) statement = statement + ", ";
        statement += "STATUS = :STATUS";
        bindValues.STATUS = req.body.STATUS;
    }
    if (req.body.COMPANY_ID) {
        if (statement) statement = statement + ", ";
        statement += "COMPANY_ID = :COMPANY_ID";
        bindValues.COMPANY_ID = req.body.COMPANY_ID;
    }

    statement += " WHERE ID = :ID";
    bindValues.ID = req.params.ID;
    statement = "UPDATE USERS_NCORDERO SET " + statement;

    return {
        statement: statement,
        bindValues: bindValues
    };
};


app.put('/users/:ID', function (req, res) {
    "use strict";

    if ("application/json" !== req.get('Content-Type')) {
        res.set('Content-Type', 'application/json').status(415).send(JSON.stringify({
            status: 415,
            message: "Wrong content-type. Only application/json is supported",
            detailed_message: null
        }));
        return;
    }

    oracledb.getConnection(conn, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json').status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        var updateStatementUsers = buildUpdateStatementUsers(req);
        connection.execute(updateStatementUsers.statement, updateStatementUsers.bindValues, {
                autoCommit: true,
                outFormat: oracledb.OBJECT // Return the result as Object
            },
            function (err, result) {
                if (err || result.rowsAffected === 0) {
                    // Error
                    res.set('Content-Type', 'application/json');
                    res.status(400).send(JSON.stringify({
                        status: 400,
                        message: err ? "Input Error" : "User doesn't exist",
                        detailed_message: err ? err.message : ""
                    }));
                } else {
                    // Resource successfully updated. Sending an empty response body. 
                    res.status(204).end();
                }
                // Release the connection
                connection.release(
                    function (err) {
                        if (err) {
                            console.error(err.message);
                        } else {
                            console.log("PUT /users/" + req.params.ID + " : Connection released ");
                        }
                    });
            });
    });
});


//****** DELETE ********

app.delete('/users/:ID', function (req, res) {
    "use strict";

    oracledb.getConnection(conn, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute("DELETE FROM USERS_NCORDERO WHERE ID = :ID", [req.params.ID], {
            autoCommit: true,
            outFormat: oracledb.OBJECT
        }, function (err, result) {
            if (err || result.rowsAffected === 0) {
                // Error
                res.set('Content-Type', 'application/json');
                res.status(400).send(JSON.stringify({
                    status: 400,
                    message: err ? "Input Error" : "User doesn't exist",
                    detailed_message: err ? err.message : ""
                }));
            } else {
                // Resource successfully deleted. Sending an empty response body. 
                res.status(204).end();
            }
            // Release the connection
            connection.release(
                function (err) {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log("DELETE /users/" + req.params.ID + " : Connection released");
                    }
                });

        });
    });
});


//**************************************************************//
//******************** SCHEMA COMPANY_NCORDERO ******************//

// ****** GET ******

app.get('/company', function (req, res) {
    "use strict";

    oracledb.getConnection(conn, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute("SELECT * FROM COMPANY_NCORDERO", {}, {
            outFormat: oracledb.OBJECT // Return the result as Object
        }, function (err, result) {
            if (err) {
                res.set('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({
                    status: 500,
                    message: "Error getting the company's",
                    detailed_message: err.message
                }));
            } else {
                res.contentType('application/json').status(200);
                res.send(JSON.stringify(result.rows));
            }
            // Release the connection
            connection.release(
                function (err) {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log("GET /company : Connection released");
                    }
                });
        });
    });
});

// *******  POST  ********

app.post('/company', function (req, res) {
    "use strict";
    if ("application/json" !== req.get('Content-Type')) {
        res.set('Content-Type', 'application/json').status(415).send(JSON.stringify({
            status: 415,
            message: "Wrong content-type. Only application/json is supported",
            detailed_message: null
        }));
        return;
    }
    oracledb.getConnection(conn, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json').status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }
        connection.execute("INSERT INTO COMPANY_NCORDERO VALUES " +
            "(:ID, :NAME, :STATUS) ", [req.body.ID, req.body.NAME,
                req.body.STATUS], {
                autoCommit: true,
                outFormat: oracledb.OBJECT // Return the result as Object
            },
            function (err, result) {
                if (err) {
                    // Error
                    res.set('Content-Type', 'application/json');
                    res.status(400).send(JSON.stringify({
                        status: 400,
                        message: err.message.indexOf("ORA-00001") > -1 ? "Company already exists" : "Input Error",
                        detailed_message: err.message
                    }));
                } else {
                    // Successfully created the resource
                    res.status(201).set('Location', '/users/' + req.body.NAME).end();
                }
                // Release the connection
                connection.release(
                    function (err) {
                        if (err) {
                            console.error(err.message);
                        } else {
                            console.log("POST /company : Connection released");
                        }
                    });
            });
    });
});


//******* PUT *********


var buildUpdateStatementCompany = function buildUpdateStatementCompany(req) {
    "use strict";

    var statement = "",
        bindValues = {};
    if (req.body.NAME) {
        statement += "NAME = :NAME";
        bindValues.NAME = req.body.NAME;
    }
    
    if (req.body.STATUS) {
        if (statement) statement = statement + ", ";
        statement += "STATUS = :STATUS";
        bindValues.STATUS = req.body.STATUS;
    }
  

    statement += " WHERE ID = :ID";
    bindValues.ID = req.params.ID;
    statement = "UPDATE COMPANY_NCORDERO SET " + statement;

    return {
        statement: statement,
        bindValues: bindValues
    };
};


app.put('/company/:ID', function (req, res) {
    "use strict";

    if ("application/json" !== req.get('Content-Type')) {
        res.set('Content-Type', 'application/json').status(415).send(JSON.stringify({
            status: 415,
            message: "Wrong content-type. Only application/json is supported",
            detailed_message: null
        }));
        return;
    }

    oracledb.getConnection(conn, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json').status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        var updateStatementCompany = buildUpdateStatementCompany(req);
        connection.execute(updateStatementCompany.statement, updateStatementCompany.bindValues, {
                autoCommit: true,
                outFormat: oracledb.OBJECT // Return the result as Object
            },
            function (err, result) {
                if (err || result.rowsAffected === 0) {
                    // Error
                    res.set('Content-Type', 'application/json');
                    res.status(400).send(JSON.stringify({
                        status: 400,
                        message: err ? "Input Error" : "Company doesn't exist",
                        detailed_message: err ? err.message : ""
                    }));
                } else {
                    // Resource successfully updated. Sending an empty response body. 
                    res.status(204).end();
                }
                // Release the connection
                connection.release(
                    function (err) {
                        if (err) {
                            console.error(err.message);
                        } else {
                            console.log("PUT /company/" + req.params.ID + " : Connection released ");
                        }
                    });
            });
    });
});


//****** DELETE ********

app.delete('/company/:ID', function (req, res) {
    "use strict";

    oracledb.getConnection(conn, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute("DELETE FROM COMPANY_NCORDERO WHERE ID = :ID", [req.params.ID], {
            autoCommit: true,
            outFormat: oracledb.OBJECT
        }, function (err, result) {
            if (err || result.rowsAffected === 0) {
                // Error
                res.set('Content-Type', 'application/json');
                res.status(400).send(JSON.stringify({
                    status: 400,
                    message: err ? "Input Error" : "Company doesn't exist",
                    detailed_message: err ? err.message : ""
                }));
            } else {
                // Resource successfully deleted. Sending an empty response body. 
                res.status(204).end();
            }
            // Release the connection
            connection.release(
                function (err) {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log("DELETE /company/" + req.params.ID + " : Connection released");
                    }
                });

        });
    });
});

//************************************************** 

app.get('/usersByCompany/:ID', function (req, res) {
    "use strict";

    oracledb.getConnection(conn, function (err, connection) {
        if (err) {
        	
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute("SELECT * FROM USERS_NCORDERO WHERE COMPANY_ID = :ID",[req.params.ID], {
            outFormat: oracledb.OBJECT 
        }, function (err, result) {
            if (err) {

                res.set('Content-Type', 'application/json');
                var status = err ? 500 : 404;
                res.status(status).send(JSON.stringify({
                    status: status,
                    message: err ? "Error getting the users" : "Users doesn't exist",
                    detailed_message: err ? err.message : ""
                }));
            
            } else {

				res.contentType('application/json').status(200);
                res.send(JSON.stringify(result.rows));
            }
            

            
            connection.release(
                function (err) {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log("GET /usersByCompany/" + req.params.ID + " : Connection released");
                    }
                });
        });
    });
});
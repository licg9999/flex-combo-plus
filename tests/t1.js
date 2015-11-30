var fs = require('fs');
var Uglify = require('uglify-js');

var toEvaluate = [];

var gulpfile = fs.readFileSync(__dirname + '/proj2/gulpfile.js').toString();
var ast = Uglify.parse(gulpfile);
ast.figure_out_scope();

function visit(node, descend){
    if(node instanceof Uglify.AST_SymbolVar && node.scope instanceof Uglify.AST_Toplevel){
        node = walker.find_parent(Uglify.AST_Statement);
        node = gulpfile.substring(node.start.pos, node.end.pos + 1);
        if(node.indexOf('require') >= 0){
            toEvaluate.push(node.replace(/require\s*\(\s*[\'\"](.+)[\'\"]\s*\)/, 'require(\'' + __dirname + '/$1\')'));
        }
    }

    if(node instanceof Uglify.AST_Defun){
        if(node.name.name === 'buildOneJS'){
            toEvaluate.push(gulpfile.substring(node.start.pos, node.end.pos + 1));
        }
        if(node.name.name === 'buildOneCSS'){
            toEvaluate.push(gulpfile.substring(node.start.pos, node.end.pos + 1));
        }
    }
}

var walker = new Uglify.TreeWalker(visit);

ast.walk(walker);

toEvaluate.push('DEBUG = true;');
console.log(toEvaluate.join('\n'));

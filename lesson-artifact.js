(function(){
  "use strict";
  var host=document.getElementById("artifact-content");
  if(!host)return;
  function inline(text){return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/«([^»]+)»/g,"<q>$1</q>");}
  function cells(line){return line.slice(1,-1).split("|").map(function(cell){return cell.trim();});}
  function render(markdown){
    var lines=markdown.split(/\r?\n/),html=["<p class=\"lesson-artifact__source\">Навчальний матеріал · джерело синхронізовано</p>"],i=0,paragraph=[];
    function flush(){if(paragraph.length){html.push("<p>"+inline(paragraph.join(" "))+"</p>");paragraph=[];}}
    while(i<lines.length){var line=lines[i];
      if(/^#{1,3} /.test(line)){flush();var level=line.match(/^#+/)[0].length;html.push("<h"+level+">"+inline(line.replace(/^#{1,3} /,""))+"</h"+level+">");i++;continue;}
      if(/^\|/.test(line)&&/^\|(?:\s*:?-+)/.test(lines[i+1]||"")){flush();var head=cells(line);i+=2;var rows=[];while(/^\|/.test(lines[i]||"")){rows.push(cells(lines[i++]));}html.push("<div class=\"lesson-artifact__table\"><table><thead><tr>"+head.map(function(x){return "<th scope=\"col\">"+inline(x)+"</th>";}).join("")+"</tr></thead><tbody>"+rows.map(function(row){return "<tr>"+row.map(function(x){return "<td>"+inline(x)+"</td>";}).join("")+"</tr>";}).join("")+"</tbody></table></div>");continue;}
      if(/^- /.test(line)){flush();var items=[];while(/^- /.test(lines[i]||"")){items.push(lines[i++].slice(2));while(lines[i]&&/^  /.test(lines[i]))items[items.length-1]+=" "+lines[i++].trim();}html.push("<ul>"+items.map(function(x){return "<li>"+inline(x)+"</li>";}).join("")+"</ul>");continue;}
      if(!line.trim())flush();else paragraph.push(line.trim());i++;
    }flush();host.innerHTML=html.join("");document.title=host.querySelector("h1")?.textContent||document.title;
  }
  fetch(host.dataset.source,{credentials:"same-origin"}).then(function(response){if(!response.ok)throw Error(response.status);return response.text();}).then(render).catch(function(){host.innerHTML="<h1>Матеріал тимчасово недоступний</h1><p>Спробуй оновити сторінку.</p>";});
})();

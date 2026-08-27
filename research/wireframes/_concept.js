(function(){
  var icons={
    'listings.html':'solar:home-2-bold-duotone',
    'chats.html':'solar:chat-round-line-bold-duotone',
    'profile-edit.html':'solar:user-rounded-bold-duotone',
    'my-listings.html':'solar:document-add-bold-duotone'
  };
  document.querySelectorAll('.phone .bottom-nav a').forEach(function(a){
    var href=(a.getAttribute('href')||'').split(/[?#]/)[0];
    if(!icons[href]||a.querySelector('iconify-icon'))return;
    var i=document.createElement('iconify-icon');
    i.setAttribute('icon',icons[href]);i.setAttribute('aria-hidden','true');
    a.prepend(i);
  });
  document.querySelectorAll('.phone .trust li').forEach(function(li){
    if(li.querySelector('iconify-icon'))return;
    var i=document.createElement('iconify-icon');
    i.setAttribute('icon',/не додано|немає|поки/i.test(li.textContent)?'solar:info-circle-bold-duotone':'solar:verified-check-bold-duotone');
    i.setAttribute('aria-hidden','true');li.prepend(i);
  });
})();

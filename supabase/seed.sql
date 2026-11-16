insert into public.fashion_items (id,name,category,rarity,price,metadata) values
('top-lilac','Lavender layer','top','Common',0,'{"starter":true}'),
('bottom-cargo','Cargo flow','bottom','Common',0,'{"starter":true}'),
('shoe-runner','Cloud runners','shoes','Common',0,'{"starter":true}'),
('acc-chain','Crown chain','accessory','Rare',120,'{}')
on conflict do nothing;

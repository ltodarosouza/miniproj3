# Guia 05: JWT (opcional)

Vocês não precisam disto para o projeto. A auth do guia 01 (token opaco em
tabela) é auth de verdade. JWT não é necessário.

JWT (JSON Web Token) é um token que carrega os próprios dados (user_id,
validade...) com assinatura criptográfica. O servidor não guarda nada: ele
verifica a assinatura em vez de consultar a tabela `sessions`.

O trade-off: JWT é *stateless* e escala sem banco de sessões. O token em
tabela é revogável: logout ou ban é deletar a linha, enquanto um JWT emitido
vale até expirar.

Migrar faz sentido quando vários serviços validam o mesmo login sem
compartilhar banco (microsserviços, API pública). Numa rede social com um
backend só, não faz.

Para estudar depois: [jwt.io](https://jwt.io) (decodifique um token no
browser) e [PyJWT](https://pyjwt.readthedocs.io/) (a lib Python).

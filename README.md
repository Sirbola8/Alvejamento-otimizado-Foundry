# Alvejamento Otimizado — Alpha 0.1.0-alpha.4

Build direcionada especificamente ao **Foundry VTT 13.351 (Version 13 Stable)** e ao **D&D 5e 5.3.3**.

## Função
Quando um alvo com um Active Effect configurado chega a 0 HP, o efeito pode ficar pendente e, no início do próximo turno do conjurador, o módulo apresenta uma seleção de novos alvos válidos, respeitando alcance e disposição.

Por padrão, a Alpha reconhece:
- Hunter's Mark
- Hex

## Compatibilidade
- Foundry VTT: **13.351 exato**
- D&D 5e: **5.3.3+ compatível dentro da geração testada**
- Midi-QOL: **opcional**; se estiver ativo, a ponte registra workflows públicos do Midi-QOL.

## Instalação
Extraia `alvejamento-otimizado/` em `Data/modules/` e ative o módulo no mundo.

## Configuração
Em **Configurações → Configurar efeitos redirecionáveis**, o GM pode editar a lista JSON de efeitos.

## Observações da Alpha
- A detecção de 0 HP é baseada no Actor.
- A troca de alvo preserva os dados do Active Effect copiados do efeito original.
- O alcance é verificado novamente no momento da transferência.
- A decisão é encaminhada ao jogador proprietário do Actor quando possível; o GM executa a criação do Active Effect por socket.
- O perfil 2014/2024 é identificado pela versão do dnd5e, mas esta Alpha não reescreve automaticamente o dano do Item/Activity. A alteração de dano deve continuar sendo feita pelo Item/Activity do sistema para evitar sobrescrever configurações da mesa.
- Teste em uma cópia do mundo antes de usar em campanha principal.


## Correção alpha.4
- O módulo não registra hooks de rolagem do D&D 5e e não chama `Item.use()`, `Activity.use()` ou métodos de rolagem de ataques/dano.
- A integração de workflow do Midi-QOL foi desativada nesta build porque não é necessária para a função de redirecionamento e poderia introduzir interferência no fluxo de rolagem.
- O fluxo normal de vantagem/desvantagem/bônus do D&D 5e/Midi-QOL permanece sob responsabilidade do sistema.

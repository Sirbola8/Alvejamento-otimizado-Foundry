// Ponte opcional mantida apenas para compatibilidade futura.
// Esta versão não registra hooks do Midi-QOL porque o Alvejamento Otimizado
// não precisa interceptar o workflow de rolagem para redirecionar efeitos.
export const MidiBridge = {
  register(_manager) {
    console.info("Alvejamento Otimizado | Midi-QOL detectado/ignorado: integração de workflow desativada nesta versão para evitar interferência nas rolagens.");
  }
};

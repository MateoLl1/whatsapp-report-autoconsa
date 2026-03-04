export interface PlantillaCallbell {
  uuid: string;
  templateType: string;
  text: string;
  title: string;
  status: string;
  category: string;
  createdAt: string;
}

export interface RespuestaPlantillaCallbell {
  template: PlantillaCallbell;
}
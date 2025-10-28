export interface BitacoraUsuario {
  id: number;
  username: string;
  rol: string;   
  first_name?: string; 
  last_name?: string;
}

export interface BitacoraLog {
  id: number;
  fecha_hora: string;
  usuario: BitacoraUsuario | null; 
  accion: string;
  descripcion: string;
  ip?: string | null;
  user_agent?: string | null;
  
}
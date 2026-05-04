import { Global, Module } from '@nestjs/common';
import { AppLogger }      from './app-logger.service';

@Global()  // Tüm modüllerde inject edilebilir — her yere import etmeye gerek yok
@Module({
  providers: [AppLogger],
  exports:   [AppLogger],
})
export class LoggerModule {}

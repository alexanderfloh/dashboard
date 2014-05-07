import play.api.GlobalSettings
import scala.io.Source
import models.MobileDevice

object Global extends GlobalSettings {
  override def onStart(app: play.api.Application) = {
    val lines = Source.fromFile("conf/devices").getLines
    lines.foreach(line => {
      line.split(";") match {
        case Array(deviceName, deviceId) => {
          if (MobileDevice.byDeviceId(deviceId) == None) {
            MobileDevice.add(deviceName, deviceId, 0)
          }
        }
      }
    })
  }
}
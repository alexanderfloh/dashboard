import play.api.GlobalSettings
import scala.io.Source
import models.MobileDevice
import play.Play
import models.Location

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

    if (Play.isDev) {
      val location1 = Location.findOrCreate("alexanderf")
      MobileDevice.byDeviceId("D185FE7D2F7A75A33C9517ED240E9F5C559FD44E")
        .map(MobileDevice.setLocation(_, location1.id))
      val location2 = Location.findOrCreate("reinholdd")
      MobileDevice.byDeviceId("435B021").map(MobileDevice.setLocation(_, location2.id))
      val geraldH = Location.findOrCreate("geraldH")
      MobileDevice.byDeviceId("ED375D86CD0C8A5EA81FC13BE326BC4431A7550A")
        .map(MobileDevice.setLocation(_, geraldH.id))
      val serverRoom = Location.findOrCreate("server room")
      MobileDevice.byDeviceId("CCFB03C4E8131B9B059051EA22FC97B9CF8D9A6F")
        .map(MobileDevice.setLocation(_, serverRoom.id))
    }
  }
}
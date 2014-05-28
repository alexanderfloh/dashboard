package models

import anorm._
import anorm.SqlParser._
import play.api.db._
import play.api.Play.current
import play.api.libs.json.Writes
import play.api.libs.json.Json

case class MobileDevice(
  id: Long,
  name: String,
  deviceId: String,
  locationId: Long)

object MobileDevice {
  def all: List[MobileDevice] = DB.withConnection { implicit c =>
    SQL("select * from device").as(mobileDevice *)
  }

  def byDeviceId(deviceId: String): Option[MobileDevice] = DB.withConnection { implicit c =>
    SQL("select * from device where deviceId = {deviceId}")
      .on('deviceId -> deviceId)
      .singleOpt(mobileDevice)
  }

  def add(name: String, deviceId: String, locationId: Long) = DB.withConnection { implicit c =>
    SQL("insert into device (name, deviceId, locationId) values ({name}, {deviceId}, {locationId})")
      .on('name -> name, 'deviceId -> deviceId, 'locationId -> locationId)
      .executeInsert() match {
        case Some(id) => MobileDevice(id, name, deviceId, locationId)
        case None => throw new RuntimeException("insert failed")
      }
  }

  def updateName(device: MobileDevice, newName: String) = DB.withConnection { implicit c =>
    SQL("update device SET name = {newName} WHERE id = {id}")
      .on('id -> device.id, 'newName -> newName)
      .executeUpdate;
  }

  def setLocation(device: MobileDevice, locationId: Long) = DB.withConnection { implicit c =>
    SQL("update device SET locationId = {location} WHERE id = {id}")
      .on('id -> device.id, 'location -> locationId)
      .executeUpdate
  }

  val mobileDevice = {
    get[Long]("id") ~
      get[String]("name") ~
      get[String]("deviceId") ~
      get[Long]("locationId") map {
        case id ~ name ~ deviceId ~ locationId => MobileDevice(id, name, deviceId, locationId)
      }
  }

  val jsonWrites = Writes[MobileDevice](d => {
    Json.obj(
      "id" -> d.id,
      "name" -> d.name,
      "deviceId" -> d.deviceId,
      "location" -> Location.byId(d.locationId).map(_.name))
  })
}
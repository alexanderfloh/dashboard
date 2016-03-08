package models

import play.api.libs.json._
import play.api.libs.functional.syntax._
import play.api.Play
import play.Logger

case class BvtResult(
    name: String,
    build: String,
    passed: Int,
    failed: Int,
    notExecuted: Int,
    nodeId: String,
    duration: Long) {
}

object BvtResult {
  val writes: Writes[BvtResult] = (
    (JsPath \ "name").write[String] and
    (JsPath \ "build").write[String] and
    (JsPath \ "passed").write[Int] and
    (JsPath \ "failed").write[Int] and
    (JsPath \ "notExecuted").write[Int] and
    (JsPath \ "nodeId").write[String] and
    (JsPath \ "duration").write[Long])(unlift(BvtResult.unapply))
}

case class RunConfig(id: String)
case class RunGroup(name: String, all: List[RunConfig]) {

}

object RunConfig {
  def configs(): List[RunConfig] = {
    groups().map(_.all).reduce((l, r) => { l ++ r })
  }
  
  def groups(): List[RunGroup] = {
    import scala.collection.JavaConverters._

    Play.current.configuration.getObject("dashboard.bvt").map {
      bvtConfigObj =>
        val bvtConfig = bvtConfigObj.toConfig
        val groupOrdering = bvtConfig.getStringList("ordering").asScala.toList
        val groups = groupOrdering.map { groupKey =>
          val groupConfig = bvtConfig.getConfig(groupKey)
          
          val groupName = groupConfig.getString("caption")
          
          val configOrdering = groupConfig.getStringList("ordering").asScala.toList
          val configs = configOrdering.map { RunConfig.apply }
          RunGroup(groupName, configs)
        }
        groups
    }.getOrElse(List())
  }
}
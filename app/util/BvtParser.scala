package util

import scala.xml.Source
import scala.xml.XML
import models.BvtResult
import models.RunConfig
import models.RunGroup
import play.Logger

object BvtParser {
  def parse(nevergreens: String): Seq[BvtResult] = {
    val xml = XML.loadString(nevergreens)
    val rows = xml \ "data" \ "row"
    rows.flatMap(row => row.child match {
      case Seq(name, build, passed, failed, notExecuted, nodeId, duration, _*) => {
        Some(BvtResult(
          name.text,
          build.text,
          passed.text.toInt,
          failed.text.toInt,
          notExecuted.text.toInt,
          nodeId.text,
          duration.text.toLong))
      }
      case other: Any => {
        Logger.error(s"unknown SC report format - ignoring: '$other'")
        None
      }
    })
  }

  def classify(results: Seq[BvtResult]): List[(RunConfig, Seq[BvtResult])] = {
    val grouped = results.groupBy { result =>
      RunConfig.all
        .find(config => config.name == result.name)

    }.collect { case (Some(key), value) => (key, value) }

    RunConfig.all.flatMap(config => grouped.find {
      case (key, _) => {
        key.name == config.name
      }
    })
  }

  def group(results: List[(RunConfig, Seq[BvtResult])]): List[(RunGroup, List[(RunConfig, Seq[BvtResult])])] = {
    val grouped = results.groupBy {
      case (config, results) =>
        RunConfig.allGroups.find(group => group.all.contains(config))
    }.collect { case (Some(key), value) => (key, value) }
    
    RunConfig.allGroups.flatMap(group => grouped.find {
      case (key, _) => {
        key.name == group.name
      }
    })
  }
}